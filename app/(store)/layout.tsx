import { AppShell } from "@/components/app/AppShell";
import { CartSheet } from "@/components/app/CartSheet";
import { ChatSheet } from "@/components/app/ChatSheet";
import { Header } from "@/components/app/Header";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { SanityLive } from "@/sanity/lib/live";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClerkProvider>
        <CartStoreProvider>
          <ChatStoreProvider>
            <AppShell>
            <Header />
            <main>{children}</main>
            </AppShell>
            <CartSheet />
            <ChatSheet />
            <Toaster position="bottom-right" />
            <SanityLive />
          </ChatStoreProvider>
        </CartStoreProvider>
      </ClerkProvider>
    </>
  );
}

export default layout;
