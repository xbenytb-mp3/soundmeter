export interface ReadingData {
  dbLevel: number;
  timestamp: string;
}

export interface SessionData {
  id: string;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  minDb: number | null;
  maxDb: number | null;
  avgDb: number | null;
  status: string;
}

export interface ChartDataPoint {
  time: number;
  db: number;
}
