import type { AppId, AppRegistry } from "@/types";

export const DEFAULT_APP_REGISTRY: AppRegistry[] = [
  {
    id: "file-manager" as AppId,
    name: "File Manager",
    icon: "📁",
    category: "utility",
    executable: true,
  },
  {
    id: "settings" as AppId,
    name: "Settings",
    icon: "⚙️",
    category: "system",
    executable: true,
  },
  {
    id: "terminal" as AppId,
    name: "Terminal",
    icon: "💻",
    category: "utility",
    executable: true,
  },
  {
    id: "browser" as AppId,
    name: "Browser",
    icon: "🌐",
    category: "productivity",
    executable: true,
  },
  {
    id: "text-editor" as AppId,
    name: "Text Editor",
    icon: "📝",
    category: "productivity",
    executable: true,
  },
];

export function getAppById(appId: AppId): AppRegistry | undefined {
  return DEFAULT_APP_REGISTRY.find((app) => app.id === appId);
}
