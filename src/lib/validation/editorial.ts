import { z } from "zod";

export const sourceSchema = z.object({
  title: z.string().trim().min(1, "Informe o título da fonte."),
  sourceDate: z.string().min(1, "Informe a data da fonte."),
  author: z.string().trim().optional(),
  body: z.string().trim().min(1, "Cole ou escreva o texto recebido."),
});

export type SourceInput = z.infer<typeof sourceSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Escreva um comentário antes de salvar."),
});

export type CommentInput = z.infer<typeof commentSchema>;
