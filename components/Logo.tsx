/**
 * Organization emblem. Kept as inline SVG rather than an <Image> so it inherits
 * `currentColor`, scales without a second network request, and can be reused by
 * the certificate renderer later.
 */
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="23" className="fill-brand-700" />
      <circle
        cx="24"
        cy="24"
        r="19"
        className="stroke-gold-400"
        strokeWidth="1.5"
      />
      <path
        d="M24 11.5 27.9 20l9.1 1.2-6.6 6.4 1.7 9.1L24 32.4l-8.1 4.3 1.7-9.1-6.6-6.4 9.1-1.2z"
        className="fill-gold-400"
      />
    </svg>
  );
}
