"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isBase64Image } from "@/utilities/utils";
import { UserValidation } from "@/lib/validations/user";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { compressAvatar } from "@/utilities/helpers";
import { getPresignedAvatarUploadUrl } from "@/utilities/apiUtils";

export default function SignUp() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof UserValidation>>({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      avatar: "",
      username: "",
      name: "",
      email: "",
      password: "",
      albumCount: 0,
      confirmPassword: "",
    },
  });

  async function handleSubmit(values: z.infer<typeof UserValidation>) {
    const blob = values.avatar;
    const hasImageChanged = isBase64Image(blob);
    const uniqueFilename: string = `${Date.now()}-${files[0].name}`;
    const imageUrl: string = `${uniqueFilename}`;
    const presignedUrl: string = await getPresignedAvatarUploadUrl(
      uniqueFilename
    );
    values.avatar = imageUrl;
    if (hasImageChanged) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
          credentials: "include",
        }
      );
      if (res.ok === true) {
        const json = await res.json();
        localStorage.setItem("currentUserProfile", JSON.stringify(json));

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: files[0],
          headers: {
            "Content-Type": files[0].type,
          },
        });

        if (uploadResponse.ok) {
          setIsUploading(true);
          console.log("File uploaded successfully: ", imageUrl);
          router.push("/");
        } else {
          console.error("Failed to upload the file: ", files[0].name);
        }
      } else {
        if (res.status === 400) {
          const errorResponse = await res.json();
          alert(errorResponse.message || "Error: Bad Request");
        } else {
          alert("An error occurred during user registration.");
        }
      }
    }
  }

  const handleImage = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const loweredQualityImage = await compressAvatar(file, 150, 150);
      const loweredQualityFile = new File([loweredQualityImage], file.name, {
        type: file.type,
        lastModified: new Date().getTime(),
      });
      setFiles(Array.from([loweredQualityFile]));

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";

        fieldChange(imageDataUrl);
      };
      fileReader.readAsDataURL(file);
    }
  };

  return (
    <main className="bg-dark-2 h-screen w-screen text-light-1">
      <div className="flex flex-col justify-center items-center h-full">
        <Image src="/assets/logo.png" alt="logo" width={176} height={92} />

        {isUploading ? (
          <div
            id="loader"
            className="loader"
            style={{ display: "block" }}
          ></div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="mt-10 flex flex-col justify-start gap-2 "
            >
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem className="flex justify-center items-center gap-2 mb-4">
                    <FormLabel className="account-form_image-label">
                      {field.value ? (
                        <div className="relative flex h-20 w-20 ">
                          <Image
                            src={field.value}
                            alt="profile photo"
                            fill
                            priority
                            className="rounded-full object-cover shadow-2xl"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Image
                            src="/assets/create.svg"
                            alt="profile photo"
                            width={48}
                            height={48}
                            className="object-contain text-light-1 mb-2"
                          />
                          <p>Select an avatar</p>
                        </div>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        placeholder="Upload a photo"
                        className="account-form_image-input"
                        onChange={(e) => handleImage(e, field.onChange)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex w-full gap-3 flex-col mb-4">
                    <FormControl>
                      <Input
                        className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                        placeholder="Email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="flex w-full gap-3 flex-col mb-4">
                    <FormControl>
                      <Input
                        className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                        placeholder="Username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex w-full gap-3 flex-col mb-4">
                    <FormControl>
                      <Input
                        className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                        placeholder="Name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex w-full gap-3 flex-col mb-4">
                    <FormControl>
                      <Input
                        className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="flex w-full gap-3 flex-col mb-4">
                    <FormControl>
                      <Input
                        className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                        placeholder="Confirm password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        )}
      </div>
    </main>
  );
}
