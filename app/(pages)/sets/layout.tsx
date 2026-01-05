export default function SetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {children}
    </section>
  );
}
