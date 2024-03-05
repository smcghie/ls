"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CommentValidation } from "@/lib/validations/comment";
import Image from "next/image";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import { User } from "@/models/models";
import { constructAvatarImageUrl } from "@/utilities/helpers";

export interface Comment {
  id: string;
  momentId: string;
  createdBy: {
    username: string;
    name: string;
    avatar: string;
    id: string;
  };
  commentText: string;
  replies: {
    author: {
      image: string;
    };
  }[];
  createdAt: string;
  isComment?: boolean;
}

interface AddComment {
  momentId: string;
  onCommentAdded: (newComment: Comment) => Promise<void>;
}

const AddCommentCard = ({ momentId, onCommentAdded }: AddComment) => {
  const [comment, setComment] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  const form = useForm<z.infer<typeof CommentValidation>>({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      momentId: "",
      createdBy: "",
      commentText: "",
      replies: [],
    },
  });

  if (!currentUser) {
    return;
  }

  const handleReset = () => {
    setComment("");
    form.reset({ ...form.getValues(), commentText: "" });
  };

  async function onSubmit(values: z.infer<typeof CommentValidation>) {
    values.momentId = momentId;
    if (currentUser) {
      //console.log("CURRENT USER: ", currentUser)
      values.createdBy = currentUser.id;
    }
    //console.log("VALUES: ", values);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
      credentials: "include",
    });
    if (res) {
      const newComment = await res.json();
      onCommentAdded(newComment);
      handleReset();
      //console.log("Comment RES:", newComment)
    } else {
      alert("error uploading User");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mr-6">
        <FormField
          control={form.control}
          name="commentText"
          render={({ field }) => (
            <FormItem className="flex w-full gap-3 items-center">
              <FormLabel>
                <div className="relative h-11 w-11">
                  <img
                    src={constructAvatarImageUrl(currentUser.avatar)}
                    alt="profile image"
                    className="rounded-full overflow-hidden shadow-2xl border-2 border-tb-3 w-full h-full"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </FormLabel>
              <FormControl className="border-none bg-transparent">
                <Textarea
                  placeholder="Add Comment..."
                  className="no focus text-light-1 bg-dark-4 bg-opacity-75 outline-none resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="comment-form_btn">
          Add Comment
        </Button>
      </form>
    </Form>
  );
};

export default AddCommentCard;
