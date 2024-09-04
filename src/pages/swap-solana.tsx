import { ReactNode } from "react";
import { Layout } from "@src/layouts";
import { ComingSoonPage } from "@src/layouts/ComingSoonPage";
import { Meta } from "@src/containers/Meta";
import SwapSolanaCard from "@src/components/SwapSolana/SwapSolanaCard";

const Swap = () => {
  return (
    <div className="h-full">
      <Meta title="Swap: Instantly Exchange cryptocurrencies with our efficient and user-friendly swap feature." description="" />
      <SwapSolanaCard />
    </div>
  );
};

Swap.getLayout = (page: ReactNode) => <Layout>{page}</Layout>;

export default Swap;