import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderIcon } from "lucide-react";

export default function ProjectSelector({ projects, selectedProject, onProjectChange, imageCount }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <FolderIcon className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Project:</span>
      </div>
      <Select value={selectedProject} onValueChange={onProjectChange}>
        <SelectTrigger className="w-48 bg-white/70">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects ({imageCount})</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project} value={project}>
              {project}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
