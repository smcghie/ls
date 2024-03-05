import * as z from "zod";

const MomentSchema = z.object({
    image: z.string(),
    description: z.string(),
    coordinates: z.array(z.number()), 
    commentCount: z.number(),
    captureDate: z.string(),
});

export const CreateAlbumValidation = z.object({
    title: z.string().min(1, "Title must be at least 1 character long"),
    albumType: z.string(),
    moments: z.array(MomentSchema),
})