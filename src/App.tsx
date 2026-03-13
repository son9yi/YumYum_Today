import React, { useState, useEffect } from "react";
import {
  Camera,
  Utensils,
  Calendar as CalendarIcon,
  ChevronLeft,
  Heart,
  Medal,
  Star,
  Upload as UploadIcon,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { GoogleGenAI, Type } from "@google/genai";
import { format, parseISO, addDays } from "date-fns";

// Types
type MealPlan = {
  date: string;
  menu: string[];
};

type LikedMenu = {
  name: string;
  count: number;
};

// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState<
    "home" | "upload" | "today" | "calendar"
  >("home");
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [likedMenus, setLikedMenus] = useState<Record<string, string[]>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const savedPlans = localStorage.getItem("mealPlans");
    const savedLikes = localStorage.getItem("likedMenus");
    if (savedPlans) setMealPlans(JSON.parse(savedPlans));
    if (savedLikes) {
      try {
        const parsed = JSON.parse(savedLikes);
        // check if it's the old format (number)
        if (Object.values(parsed).some((v) => typeof v === "number")) {
          localStorage.removeItem("likedMenus");
        } else {
          setLikedMenus(parsed);
        }
      } catch (e) {}
    }
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    localStorage.setItem("mealPlans", JSON.stringify(mealPlans));
  }, [mealPlans]);

  useEffect(() => {
    localStorage.setItem("likedMenus", JSON.stringify(likedMenus));
  }, [likedMenus]);

  const handleLike = (menuItem: string, date: string, e: React.MouseEvent) => {
    let isLiking = true;
    setLikedMenus((prev) => {
      const dates = prev[menuItem] || [];
      if (dates.includes(date)) {
        isLiking = false;
        return {
          ...prev,
          [menuItem]: dates.filter((d) => d !== date),
        };
      } else {
        return {
          ...prev,
          [menuItem]: [...dates, date],
        };
      }
    });

    if (isLiking) {
      // Confetti animation
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ["#FFD700", "#FF69B4", "#00FF00", "#00BFFF"],
        shapes: ["star", "circle"],
        disableForReducedMotion: true,
        zIndex: 1000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9C4] font-jua text-gray-800 selection:bg-[#C8E6C9]">
      <div className="max-w-md mx-auto bg-white/40 min-h-screen shadow-xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === "home" && (
            <HomeView key="home" onNavigate={setCurrentView} />
          )}
          {currentView === "upload" && (
            <UploadView
              key="upload"
              onNavigate={() => setCurrentView("home")}
              setMealPlans={setMealPlans}
            />
          )}
          {currentView === "today" && (
            <TodayMealView
              key="today"
              onNavigate={() => setCurrentView("home")}
              mealPlans={mealPlans}
              onLike={handleLike}
              likedMenus={likedMenus}
            />
          )}
          {currentView === "calendar" && (
            <CalendarView
              key="calendar"
              onNavigate={() => setCurrentView("home")}
              likedMenus={likedMenus}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Components ---

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center p-4 bg-[#C8E6C9] shadow-sm sticky top-0 z-10 rounded-b-3xl">
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-white/50 transition-colors"
      >
        <ChevronLeft className="w-8 h-8 text-green-800" />
      </button>
      <h1 className="text-2xl flex-1 text-center pr-12 text-green-900 drop-shadow-sm">
        {title}
      </h1>
    </div>
  );
}

function BouncyButton({
  onClick,
  icon: Icon,
  text,
  colorClass,
}: {
  onClick: () => void;
  icon: any;
  text: string;
  colorClass: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`w-full flex items-center p-4 rounded-[2rem] shadow-md border-4 border-white/50 ${colorClass} text-xl text-gray-800 transition-colors`}
    >
      <div className="bg-white/80 p-2 rounded-full mr-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <span className="flex-1 text-left drop-shadow-sm">{text}</span>
    </motion.button>
  );
}

const HomeView: React.FC<{ onNavigate: (view: any) => void }> = ({
  onNavigate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center p-4 pt-10 h-full min-h-screen"
    >
      <motion.h1
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="text-5xl text-center text-orange-500 drop-shadow-md mb-8"
      >
        오늘 급식 뭐야?
      </motion.h1>

      <div className="flex-1 flex items-center justify-center w-full pb-16">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="relative w-64 h-48"
        >
          {/* Cute Round Tray */}
          <div className="w-full h-full bg-[#C8E6C9] rounded-[2.5rem] flex flex-col shadow-lg border-[5px] border-white/80 relative p-3 gap-3">
            {/* Top compartments (Side dishes) */}
            <div className="flex w-full gap-3 h-16">
              <div className="flex-1 bg-white/70 rounded-full shadow-inner flex items-center justify-center text-3xl">
                🥦
              </div>
              <div className="flex-1 bg-white/70 rounded-full shadow-inner flex items-center justify-center text-3xl">
                🥚
              </div>
              <div className="flex-1 bg-white/70 rounded-full shadow-inner flex items-center justify-center text-3xl">
                🍎
              </div>
            </div>
            {/* Bottom compartments (Rice & Soup) */}
            <div className="flex w-full gap-3 flex-1">
              <div className="flex-1 bg-white/70 rounded-2xl shadow-inner flex items-center justify-center text-5xl">
                🍚
              </div>
              <div className="flex-1 bg-white/70 rounded-2xl shadow-inner flex flex-col items-center justify-center relative">
                {/* Cute Face */}
                <div className="flex gap-3 mb-1.5 z-10">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                </div>
                <div className="w-5 h-2.5 border-b-[3px] border-gray-800 rounded-full z-10"></div>
                {/* Blushes */}
                <div className="absolute top-1/2 left-4 w-4 h-2 bg-pink-400 rounded-full opacity-50"></div>
                <div className="absolute top-1/2 right-4 w-4 h-2 bg-pink-400 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-3 bg-yellow-300 text-yellow-900 px-5 py-2 rounded-full text-sm font-bold shadow-md transform rotate-6">
            동글이 식판
          </div>
        </motion.div>
      </div>

      <div className="w-full space-y-3 pb-4">
        <BouncyButton
          onClick={() => onNavigate("upload")}
          icon={Camera}
          text="식단표 업로드"
          colorClass="bg-blue-200 hover:bg-blue-300"
        />
        <BouncyButton
          onClick={() => onNavigate("today")}
          icon={Utensils}
          text="오늘 급식 보기"
          colorClass="bg-green-200 hover:bg-green-300"
        />
        <BouncyButton
          onClick={() => onNavigate("calendar")}
          icon={CalendarIcon}
          text="냠냠 달력"
          colorClass="bg-pink-200 hover:bg-pink-300"
        />
      </div>
    </motion.div>
  );
};

const UploadView: React.FC<{
  onNavigate: () => void;
  setMealPlans: (plans: MealPlan[]) => void;
}> = ({ onNavigate, setMealPlans }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64 with compression to speed up AI processing
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve(dataUrl.split(",")[1]);
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
            {
              text: "이 학교 식단표 이미지에서 날짜와 메뉴를 추출해줘. 날짜는 'YYYY-MM-DD' 형식으로, 메뉴는 문자열 배열로 만들어줘. 불필요한 알레르기 정보 번호나 특수문자는 제거하고 순수 음식 이름만 남겨줘.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD" },
                menu: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["date", "menu"],
            },
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr) as MealPlan[];
        setMealPlans(parsed);
        alert("식단표가 성공적으로 저장되었어요! 🍱✨");
        onNavigate();
      } else {
        throw new Error("결과를 읽을 수 없어요.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "식단표를 읽는 데 실패했어요. 다시 시도해 주세요!",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full min-h-screen bg-blue-50"
    >
      <TopBar title="식단표 업로드" onBack={onNavigate} />

      <div className="p-4 flex-1 flex flex-col items-center justify-center">
        <div className="bg-white p-5 rounded-3xl shadow-lg w-full text-center border-4 border-blue-200">
          <p className="text-lg mb-4 text-blue-800 font-bold">
            이번 달 식단표 사진을 올려주세요!
          </p>

          <label className="cursor-pointer relative block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div
              className={`w-full h-40 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center transition-colors ${preview ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-xl opacity-50"
                />
              ) : (
                <>
                  <UploadIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-500">여기를 눌러 사진 선택</span>
                </>
              )}

              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl backdrop-blur-sm">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-2" />
                  <p className="text-blue-700 font-bold animate-pulse">
                    식단표를 읽는 중... 📖
                  </p>
                </div>
              )}
            </div>
          </label>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TodayMealView: React.FC<{
  onNavigate: () => void;
  mealPlans: MealPlan[];
  onLike: (menu: string, date: string, e: React.MouseEvent) => void;
  likedMenus: Record<string, string[]>;
}> = ({ onNavigate, mealPlans, onLike, likedMenus }) => {
  const [showTomorrow, setShowTomorrow] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  let currentIndex = mealPlans.findIndex((p) => p.date === todayStr);
  if (currentIndex === -1) currentIndex = 0; // Fallback to first item if today is not found

  let targetPlan;

  if (showTomorrow) {
    targetPlan = mealPlans.find((p) => p.date === tomorrowStr);
    // Fallback: If tomorrow's exact date isn't found (e.g. weekend), show the NEXT available meal plan
    if (!targetPlan && mealPlans.length > currentIndex + 1) {
      targetPlan = mealPlans[currentIndex + 1];
    }
  } else {
    targetPlan = mealPlans.find((p) => p.date === todayStr);
    // Fallback: If today's exact date isn't found, show the current index (0)
    if (!targetPlan && mealPlans.length > 0) {
      targetPlan = mealPlans[currentIndex];
    }
  }

  const displayDate = targetPlan
    ? parseISO(targetPlan.date)
    : showTomorrow
      ? addDays(new Date(), 1)
      : new Date();

  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const displayDateString = `${format(displayDate, "M월 d일")}(${days[displayDate.getDay()]})`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full min-h-screen bg-green-50"
    >
      <TopBar
        title={showTomorrow ? "내일 급식 미리보기" : "오늘 급식 보기"}
        onBack={onNavigate}
      />

      <div className="p-4 flex-1 flex flex-col">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-5 border-4 border-green-200 relative overflow-hidden flex-1 flex flex-col">
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-200 rounded-full opacity-50"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-200 rounded-full opacity-50"></div>

          <div className="relative z-10 flex-1 flex flex-col">
            <h2 className="text-2xl text-center text-green-800 mb-2">
              {displayDateString}
            </h2>

            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-2xl text-center mb-4 shadow-inner font-bold text-lg animate-bounce">
              {showTomorrow
                ? "내일은 이런 메뉴가 나와요! 👀"
                : '"우와! 오늘 맛있는 거 나온다! 😋"'}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 mb-4">
              {targetPlan ? (
                <ul className="space-y-3">
                  {targetPlan.menu.map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border-2 border-gray-100"
                    >
                      <span className="text-lg text-gray-700">{item}</span>
                      {!showTomorrow && targetPlan && (
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => onLike(item, targetPlan.date, e)}
                          className="p-2 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors"
                        >
                          <Heart
                            className={`w-7 h-7 ${likedMenus[item]?.includes(targetPlan.date) ? "fill-pink-500" : ""}`}
                          />
                        </motion.button>
                      )}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-xl">아직 등록된 식단표가 없어요!</p>
                  <p className="text-sm mt-2">
                    홈 화면에서 식단표를 업로드해주세요.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowTomorrow(!showTomorrow)}
              className="w-full py-3 bg-green-100 text-green-800 font-bold rounded-2xl shadow-sm border-2 border-green-200 hover:bg-green-200 transition-colors"
            >
              {showTomorrow ? "오늘 급식 보기" : "내일 급식 미리보기"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CalendarView: React.FC<{
  onNavigate: () => void;
  likedMenus: Record<string, string[]>;
}> = ({ onNavigate, likedMenus }) => {
  // Calculate top 3
  const topMenus = Object.entries(likedMenus)
    .map(
      ([menu, dates]) => [menu, (dates as string[]).length] as [string, number],
    )
    .filter(([menu, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const medals = ["text-yellow-400", "text-gray-400", "text-amber-600"];
  const bgColors = ["bg-yellow-50", "bg-gray-50", "bg-amber-50"];
  const borderColors = [
    "border-yellow-200",
    "border-gray-200",
    "border-amber-200",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full min-h-screen bg-pink-50"
    >
      <TopBar title="냠냠 달력" onBack={onNavigate} />

      <div className="p-4 flex-1 flex flex-col">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-5 border-4 border-pink-200">
          <h2 className="text-xl text-center text-pink-800 mb-4 flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            이번 달 베스트 메뉴 TOP 3
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </h2>

          {topMenus.length > 0 ? (
            <div className="space-y-3">
              {topMenus.map(([menu, count], idx) => (
                <motion.div
                  key={menu}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className={`flex items-center p-3 rounded-2xl border-4 ${borderColors[idx]} ${bgColors[idx]} relative overflow-hidden`}
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Medal className="w-20 h-20" />
                  </div>

                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm mr-3 z-10">
                    <Medal className={`w-6 h-6 ${medals[idx]}`} />
                  </div>

                  <div className="flex-1 z-10">
                    <div className="text-xs text-gray-500 font-bold">
                      {idx + 1}위
                    </div>
                    <div className="text-lg text-gray-800">{menu}</div>
                  </div>

                  <div className="z-10 flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-pink-100">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span className="font-bold text-pink-600">{count}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-5xl mb-3">🍱</div>
              <p className="text-lg">아직 하트를 누른 메뉴가 없어요!</p>
              <p className="text-sm mt-2">
                오늘 급식에서 맛있는 메뉴에 하트를 눌러보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
