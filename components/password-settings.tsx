"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { passwordChangeSchema } from "@/lib/password-policy";

export function PasswordSettings() {
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  return (
    <section className="password-settings" id="password-settings" aria-labelledby="password-settings-title">
      <h2 id="password-settings-title">운영자 비밀번호 변경</h2>
      <p className="admin-help">기억하기 편한 8자 이상의 비밀번호를 정해 주세요. 특수문자는 필수가 아닙니다.</p>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = new FormData(form);
        const parsed = passwordChangeSchema.safeParse(Object.fromEntries(fields));
        setMessage("");
        setError(false);
        if (!parsed.success) { setError(true); setMessage(parsed.error.issues[0].message); return; }
        setBusy(true);
        try {
          const response = await fetch("/api/admin/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "비밀번호를 변경하지 못했습니다.");
          form.reset();
          setVisible(false);
          setMessage("비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용해 주세요.");
          router.refresh();
        } catch (cause) {
          setError(true);
          setMessage(cause instanceof Error ? cause.message : "연결을 확인하고 다시 시도해 주세요.");
        } finally { setBusy(false); }
      }}>
        <fieldset disabled={busy}>
          <legend className="sr-only">현재 비밀번호와 새 비밀번호 입력</legend>
          <label className="form-field">현재 비밀번호
            <input name="currentPassword" type="password" autoComplete="current-password" required maxLength={256} />
          </label>
          <div className="form-row">
            <label className="form-field">새 비밀번호
              <input name="newPassword" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={256} aria-describedby="password-help" />
            </label>
            <label className="form-field">새 비밀번호 확인
              <input name="confirmPassword" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={256} />
            </label>
          </div>
          <label className="check-row"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />새 비밀번호 표시</label>
          <p id="password-help" className="admin-help">변경 후 다른 기기는 다시 로그인해야 합니다. 이 화면에서는 계속 작업할 수 있습니다.</p>
          <button className="primary-button" disabled={busy}>{busy ? "변경 중…" : "새 비밀번호 저장"}</button>
        </fieldset>
        <p className={`form-status${error ? " error" : ""}`} role={error ? "alert" : "status"}>{message}</p>
      </form>
    </section>
  );
}
