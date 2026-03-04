export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="min-h-screen">
      <header className="border-b border-zinc-200 bg-zinc-50 px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">Account Header</h1>
      </header>
      <main className="px-6 py-6">{children}</main>
    </section>
  );
}
