'use client';

import { getAssetPath } from '@/lib/assets';

const LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rolivela' },
  { label: 'GitHub', href: 'https://github.com/RoliVela' },
  { label: 'Resume', href: getAssetPath('/assets/resume.pdf') },
];

export default function ComputerUnlockedInteraction() {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
      <div className="text-center">
        <h2 className="font-vt323 text-3xl text-pink-200">Roli&apos;s Links</h2>
        <p className="font-vt323 text-lg text-pink-100/80">
          Access granted. Choose a destination below.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded border-2 border-pink-300/40 bg-purple-900 px-6 py-3 text-center font-vt323 text-2xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
