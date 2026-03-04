import AccountClient from "./AccountClient";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        我的账户
      </h1>
      <AccountClient />
    </main>
  );
}