"use client";
import { Id } from "../../convex/_generated/dataModel";
import { ScrollArea } from "./ui/scroll-area";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import {
  MoreVerticalIcon,
  TrashIcon,
  PlusIcon,
  SendIcon,
  LoaderIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Image from "next/image";
import { useImageUpload } from "@/hooks/use-image-upload";
export function Messages({
  id,
}: {
  id: Id<"directMessages"> | Id<"channels">;
}) {
  const messages = useQuery(api.functions.message.list, {
    dmOrChannelId: id,
  });
  return (
    <>
      {/* allow user to scroll through messages of the screen */}
      <ScrollArea className="h-full p-4">
        {messages?.map((message) => (
          <MessageItem key={message._id} message={message} />
        ))}
      </ScrollArea>
      <TypingIndicator id={id} />
      <MessageInput id={id} />
    </>
  );
}
// the message type is the return type of the message.list function
// this allows us to use the message type to define the message prop
type Message = FunctionReturnType<typeof api.functions.message.list>[number];
function MessageItem({ message }: { message: Message }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Avatar className="size-8 border">
        <AvatarImage src={message.sender?.image} />
        <AvatarFallback />
      </Avatar>
      <div className="flex flex-col mr-auto">
        <p className="text-xs text-muted-foreground">
          {message.sender?.username ?? "Deleted User"}
        </p>
        <p className="text-sm font-semibold">{message.content}</p>
        {message.attachment && (
          <Image
            alt="Attachment"
            src={message.attachment}
            width={300}
            height={300}
            className="rounded border overflow-hidden"
          />
        )}
      </div>
      <MessageActions message={message} />
    </div>
  );
}
function TypingIndicator({ id }: { id: Id<"directMessages" | "channels"> }) {
  const usernames = useQuery(api.functions.typing.list, { dmOrChannelId: id });
  if (!usernames || usernames.length === 0) {
    return null;
  }
  const typingText = usernames.length > 1 ? "are" : "is";
  return (
    <div className="text-sm text-muted-foreground px-4 py-2">
      {usernames.join(", ")} {typingText} typing...
    </div>
  );
}
function MessageActions({ message }: { message: Message }) {
  const user = useQuery(api.functions.user.get);
  const removeMutation = useMutation(api.functions.message.remove);
  if (!user || message.sender?._id !== user._id) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreVerticalIcon className="size-4 text-muted-foreground" />
        <span className="sr-only">Message Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* text-destructive makes the text red */}
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => removeMutation({ id: message._id })}
        >
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function MessageInput({ id }: { id: Id<"directMessages" | "channels"> }) {
  const [content, setContent] = useState("");
  const sendMessage = useMutation(api.functions.message.create);
  const sendTypingIndicator = useMutation(api.functions.typing.upsert);
  const imageUpload = useImageUpload();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendMessage({
        dmOrChannelId: id,
        content,
        attachment: imageUpload.storageId,
      });
      setContent("");
      imageUpload.reset();
    } catch (error) {
      toast.error("Failed to send message.", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred.",
      });
    }
  };
  return (
    <>
      <form className="flex items-end p-4 gap-2" onSubmit={handleSubmit}>
        <Button
          // buttons can have two types: button or submit
          // the default type is submit
          // by setting the type to button, the button will not submit the form
          type="button"
          size="icon"
          onClick={() => {
            imageUpload.open();
          }}
        >
          <PlusIcon />
          <span className="sr-only">Attach</span>
        </Button>
        <div className="flex flex-col flex-1 gap-2">
        {imageUpload.previewUrl && (
            <>
              {/* <Button
                  size="icon"
                  type="button"
                  onClick={() => removeAttachment}
                >
                  <TrashIcon />
                  <span className="sr-only">Remove</span>
                </Button> */}
               <ImagePreview
                url={imageUpload.previewUrl}
                isUploading={imageUpload.isUploading}
              />
            </>
          )}
          <Input
            placeholder="Message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={() => {
              if (content.length > 0) {
                sendTypingIndicator({ dmOrChannelId: id });
              }
            }}
          />
        </div>
        <Button size="icon">
          <SendIcon />
          <span className="sr-only">Send</span>
        </Button>
      </form>
      <input
        {...imageUpload.inputProps} // takes ALL properties in imageUpload.inputProps and applies them to the input element
      ></input>
    </>
  );
}
// add image preview
function ImagePreview({
  url,
  isUploading,
}: {
    url: string;
  isUploading: boolean;
}) {
  return (
    <div className="relative max-w-40 max-h-40 overflow-hiddent rounded border">
      {/* <Button
          size="icon"
          className="absolute top-2 right-2"
          // onClick={() => removeAttachment}
        >
          <TrashIcon />
          <span className="sr-only">Remove</span>
        </Button> */}
      <Image
        src={url}
        alt="Attachment Preview"
        layout="responsive"
        width={300}
        height={300}
        className="rounded border overflow-hidden"
      />
      {isUploading && (
        // tint the image with a black overlay while uploading
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <LoaderIcon className="animate-spin size-8 text-white" />
        </div>
      )}
    </div>
  );
}