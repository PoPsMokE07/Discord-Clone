"use client";
import { Messages } from "@/components/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";

import React, { use } from "react";
export default function MessagePage({
  params,
}: {
  params: Promise<{ id: Id<"directMessages"> }>;
}) {
  // the params property is a promise meaning you will need to await it
  // or use(params)
  const { id } = use(params);
  const directMessage = useQuery(api.functions.dm.get, { id });
  if (!directMessage) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col divide-y max-h-screen">
      <header className="flex items-center gap-2 p-4">
        <Avatar className="size-8 border">
          <AvatarImage src={directMessage.otherUser.image} />
          <AvatarFallback />
        </Avatar>
        <h1 className="font-semibold">{directMessage.otherUser.username}</h1>
      </header>
      <Messages id={id} />
    </div>
  );
}
