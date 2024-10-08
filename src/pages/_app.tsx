import Providers from "@src/containers/provider";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import type { AppProps } from "next/app";
import { ReactNode, useEffect, useMemo, useState } from "react";
import "../styles/global.css";
import { PhantomProvider } from "@src/utils/phantomUtils/usePhantom";
import { ClusterProvider } from '@src/utils/phantomUtils/ClusterProvider'
import { SolanaProvider } from '@src/utils/phantomUtils/SolanaProvider'
require('@solana/wallet-adapter-react-ui/styles.css');


const MyApp = ({ Component, pageProps }: AppProps) => {
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const getLayout = Component.getLayout ?? ((page: ReactNode) => page);

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/anza-xyz/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
      // new UnsafeBurnerWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Providers>
            <ClusterProvider>
              <SolanaProvider>
                <PhantomProvider>
                  {getLayout(<Component {...pageProps} />)}
                </PhantomProvider>
              </SolanaProvider>
            </ClusterProvider>
          </Providers>
          { /* Your app's components go here, nested within the context providers. */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>

  );
};

export default MyApp;
