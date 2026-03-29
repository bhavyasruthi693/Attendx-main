import { BookOpen, FlaskConical } from "lucide-react";

export function SubjectsCard() {
  const subjects = [
    { code: "DBMS", name: "Database Management Systems" },
    { code: "DAA", name: "Design and Analysis of Algorithms" },
    { code: "MP", name: "Microprocessors" },
    { code: "FLAT", name: "Formal Languages & Automaton Theory" },
    { code: "ME", name: "Managerial Economics" },
  ];

  const labs = [
    { code: "DBMS/ALC", name: "DBMS Lab / Algorithm Lab through C++" },
    { code: "WT/DBMS", name: "Web Technologies / DBMS Lab" },
    { code: "WT/ALC", name: "Web Technologies / Algorithm Lab" },
  ];

  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 h-full shadow-2xl overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
      
      {/* Subjects Section */}
      <div className="relative z-10 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-white">Subjects</h3>
        </div>
        <div className="space-y-1.5">
          {subjects.map((subject) => (
            <div key={subject.code} className="flex items-center gap-2 group">
              <span className="text-xs font-medium text-primary min-w-[40px] px-1.5 py-0.5 rounded bg-primary/10 text-center">
                {subject.code}
              </span>
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors truncate">
                {subject.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3" />

      {/* Labs Section */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20">
            <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Labs</h3>
        </div>
        <div className="space-y-1.5">
          {labs.map((lab) => (
            <div key={lab.code} className="flex items-center gap-2 group">
              <span className="text-xs font-medium text-emerald-400 min-w-[40px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-center">
                {lab.code}
              </span>
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors truncate">
                {lab.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
