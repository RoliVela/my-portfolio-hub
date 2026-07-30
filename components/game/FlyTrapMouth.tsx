'use client';

import MonsterMouth from './MonsterMouth';

export interface FlyTrapMouthProps {
  /** 0-100 water fill percentage for the belly. */
  waterPercent: number;
  /** When true, show a wavy pulsing surface on top of the water. */
  showWaterSurface?: boolean;
  /** Number of caught items to render inside the belly. */
  caughtItems?: number;
  /** Number of nutrient specks to render inside the belly. */
  nutrientSpecks?: number;
  /** Tailwind class for the water fill color. */
  waterColorClass?: string;
  /** Tailwind class for the jaw/belly shell color. */
  jawColorClass?: string;
  /** Tailwind class for the tooth color. */
  toothColorClass?: string;
  /** Icon or element rendered for each caught item. */
  itemIcon?: React.ReactNode;
  /** Additional class names for the root wrapper. */
  className?: string;
}

export default function FlyTrapMouth(props: FlyTrapMouthProps) {
  return (
    <MonsterMouth
      preset="fly-trap"
      jawColorClass="bg-rose-700 border-pink-300"
      bellyBgColorClass="bg-rose-900/40"
      {...props}
    />
  );
}
