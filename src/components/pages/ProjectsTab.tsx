import {
  Gamepad,
  Music,
  Laptop,
  Video,
  LucideIcon,
  CheckSquare
} from "lucide-react";
import { ProjectItem } from "../../data/bioData";

// Dynamic Lucide icon mapper helper
const iconMap: Record<string, LucideIcon> = {
  Gamepad,
  Music,
  Laptop,
  Video,
};

interface ProjectsTabProps {
  projects: ProjectItem[];
}

export default function ProjectsTab({ projects }: ProjectsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-l-2 border-indigo-400/70 pl-2">
        <CheckSquare className="w-4 h-4 md:w-4.5 md:h-4.5 text-indigo-400" />
        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-200 font-mono">
          Current Projects
        </h3>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] md:text-xs font-mono">
        {projects.map((project, idx) => {
          const IconComponent = iconMap[project.icon] || Laptop;
          return (
            <li
              key={idx}
              className="flex items-start gap-2.5 bg-white/[0.01] border border-white/5 p-2.5 md:p-3 rounded-lg hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-left"
            >
              <IconComponent className={`w-4 h-4 md:w-4.5 md:h-4.5 ${project.color} mt-0.5 shrink-0`} />
              <div>
                <p className="font-bold text-stone-200 uppercase text-[9px] md:text-[10px] tracking-wider">
                  {project.title}
                </p>
                <p className="text-stone-400 mt-0.5 leading-relaxed font-sans text-xs">
                  {project.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
