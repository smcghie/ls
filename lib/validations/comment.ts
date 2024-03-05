import * as z from "zod";

const UserSchema = z.object({
    id: z.string(),
    avatar: z.string(),
    name: z.string(),
    username: z.string(),
  });
  
  export const CommentValidation = z.object({
    momentId: z.string(),
    createdBy: z.string(),
    commentText: z.string().min(3, { message: "Minimum 3 characters" }),
    replies: z.array(z.string()),
  });