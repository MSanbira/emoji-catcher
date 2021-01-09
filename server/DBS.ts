interface User {
  id: string; // index
  email: string;
  name: string | null;
  isVerified: boolean; // default: false
}

interface UserData {
  userId: string; // index
  emojis: string[];
  points: number; // how to quick search?
  achievements: string[];
  shiny: string[];
  updatedAt: number; // dateTime
}

interface UserStats {
  userId: string; // index
  avgTimeToClick: number;
  lastSecClick: number;
  firstSecClick: number;
  missedEmojis: number;
  updatedAt: number; // dateTime
}

// optional for future stats
interface EmojiClick {
  userId: string; // index
  emoji: string;
  isShiny: boolean;
  secToClick: number;
  points: number;
  clickedAt: number; // dateTime, index
}
