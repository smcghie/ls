import * as z from "zod";

export const UserValidation = z.object({
    avatar: z.string().url().nonempty(),
    username: z.string().min(3, { message: "Username must be at least 3 characters"}).max(30),
    name: z.string().min(3, { message: "Name must be at least 3 characters"}).max(30),
    email: z.string().min(3, { message: "Email must be at least 3 characters"}).email(),
    password: z.string().min(6, { message: "Password must be at least 6 characters"}),
    albumCount: z.number(),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});