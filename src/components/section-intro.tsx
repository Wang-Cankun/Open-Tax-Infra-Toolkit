interface SectionIntroProps {
  children: React.ReactNode;
}

export default function SectionIntro({ children }: SectionIntroProps) {
  return (
    <div className="bg-navy-light/40 border border-navy-light rounded-lg px-6 py-5 text-sm leading-relaxed text-ink-muted">
      {children}
    </div>
  );
}
