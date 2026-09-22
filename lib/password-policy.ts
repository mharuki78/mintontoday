import { z } from "zod";

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요.").max(256),
  newPassword: z.string().min(8, "새 비밀번호는 8자 이상으로 입력해 주세요.").max(256, "비밀번호는 256자 이하로 입력해 주세요.")
    .refine(value => value.trim().length > 0, "공백만으로는 비밀번호를 만들 수 없습니다."),
  confirmPassword: z.string().max(256),
}).strict().superRefine((value, ctx) => {
  if (value.newPassword !== value.confirmPassword)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "새 비밀번호가 서로 다릅니다." });
  if (value.newPassword === value.currentPassword)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["newPassword"], message: "현재와 다른 새 비밀번호를 입력해 주세요." });
});
