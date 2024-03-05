"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { SignInValidation } from "@/lib/validations/sign";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();

  const form = useForm<z.infer<typeof SignInValidation>>({
    resolver: zodResolver(SignInValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignInValidation>) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (res.ok) {
      const json = await res.json();
      //localStorage.setItem("currentUser", json.user.id)
      localStorage.setItem("currentUserProfile", JSON.stringify(json));
      router.push("/");
    } else {
      //console.log(res);
      alert("bad credentials");
    }
  }
  return (
    <main className="bg-dark-2 h-screen w-screen">
      <div className="flex flex-col justify-center items-center h-full text-light-1">
        <Image src="/assets/logo.png" alt="logo" width={176} height={92} />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-10 flex flex-col justify-start gap-8"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex w-full gap-3 flex-col">
                  <FormControl>
                    <Input
                      className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                      placeholder="Add username..."
                      autoComplete="username"
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
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-tb-3 bg-opacity-50 text-light-1 border-gray-3"
                      placeholder="Add password..."
                      autoComplete="current-password"
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
        <div>
          <Link href="/signup" className="flex items-center gap-4 mt-10">
            <p className="italic text-gray-3 hover:text-light-1">
              Not a user? Sign up here.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
