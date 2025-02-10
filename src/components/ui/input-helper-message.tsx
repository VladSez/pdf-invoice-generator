export const InputHelperMessage = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <p
      className="mt-1 text-balance text-xs text-zinc-700/90"
      role="region"
      aria-live="polite"
    >
      {children}
    </p>
  );
};
