import * as z from "zod";

export const CreateMomentValidation = z.object({
    image: z.string(),
    description: z.string(),
    coordinates: z.array(z.number()), 
    commentCount: z.number(),
    captureDate: z.string(),
    albumId: z.string()
})

export const UpdateAlbumValidation = z.object({
    image: z.string(),
    title: z.string(),
    description: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    commentCount: z.number(),
    captureDate: z.string(),
})