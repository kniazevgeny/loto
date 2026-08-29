import { speedometerNeedleAngle } from "../game/pace";

export function GameSpeedometer({ seconds }: { seconds: number }) {
  const needleAngle = speedometerNeedleAngle(seconds);
  return <svg className={seconds < 3 ? "game-speedometer overdrive" : "game-speedometer"} viewBox="0 0 60 38" aria-hidden="true">
    <path className="speedometer-slow" d="M7 30 A24 24 0 0 1 19 9" />
    <path className="speedometer-medium" d="M21 8 A24 24 0 0 1 39 8" />
    <path className="speedometer-fast" d="M41 9 A24 24 0 0 1 53 30" />
    <line className="speedometer-needle" x1="30" y1="30" x2="30" y2="12" transform={`rotate(${needleAngle} 30 30)`} />
    <circle className="speedometer-cap" cx="30" cy="30" r="3" />
  </svg>;
}
