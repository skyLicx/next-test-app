"use client";

import { useEffect, useState } from "react";
import { User, Mail, Hash, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getAccountInfo, type AccountInfo } from "@/lib/api/account-api";

export default function AccountClient() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = () => {
    setLoading(true);
    setError(null);
    const { promise } = getAccountInfo();
    promise
      .then((data) => {
        setAccount(data);
      })
      .catch((err) => {
        setError(err?.message ?? "获取账户信息失败");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const { promise } = getAccountInfo();
    promise
      .then((data) => {
        setAccount(data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message ?? "获取账户信息失败");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="size-8 animate-spin text-slate-400" aria-hidden />
        <p className="text-sm text-slate-500">正在加载账户信息…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/30">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="size-5 shrink-0" aria-hidden />
          <span className="font-medium">加载失败</span>
        </div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-500">{error}</p>
        <button
          type="button"
          onClick={fetchAccount}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          <RefreshCw className="size-4" aria-hidden />
          重试
        </button>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
        账户信息
      </h2>
      <dl className="space-y-4">
        <div className="flex items-center gap-3">
          <dt className="flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400">
            <Hash className="size-4" aria-hidden />
            <span className="text-sm">ID</span>
          </dt>
          <dd className="text-slate-800 dark:text-slate-200">{account.id}</dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400">
            <User className="size-4" aria-hidden />
            <span className="text-sm">姓名</span>
          </dt>
          <dd className="text-slate-800 dark:text-slate-200">{account.name}</dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400">
            <Mail className="size-4" aria-hidden />
            <span className="text-sm">邮箱</span>
          </dt>
          <dd className="text-slate-800 dark:text-slate-200">{account.email}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={fetchAccount}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:focus:ring-offset-slate-900"
      >
        <RefreshCw className="size-4" aria-hidden />
        刷新
      </button>
    </div>
  );
}
