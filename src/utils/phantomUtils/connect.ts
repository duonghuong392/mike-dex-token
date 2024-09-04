import { PhantomInjectedProvider, TLog } from './types';
import { PublicKey } from '@solana/web3.js';
import { getEthereumSelectedAddress } from './getEthereumSelectedAddress';

// MULTI-CHAIN PROVIDER TIP: Connect using the ethereum provider first for the best experience
// use onlyIfTrusted on the solana connect request, so we don't double pop up.
export const connect = async ({ solana, ethereum }: PhantomInjectedProvider, createLog: (log: TLog) => void) => {
  try {
    if (!solana.isConnected) {
      await solana.connect();
    }
  } catch (error) {
    createLog({
      providerType: 'solana',
      status: 'error',
      method: 'connect',
      message: error.message,
    });
  }
};

// Similar to solana.connect({onlyIfTrusted: true}) but for multi-chain
// MULTI-CHAIN PROVIDER TIP: Must use the solana provider first, and only the call eth provider if the solana call is successful
export const silentlyConnect = async (
  { solana, ethereum }: PhantomInjectedProvider,
  createLog: (log: TLog) => void
) => {
  let solanaPubKey: { publicKey: PublicKey } | undefined;
  try {
    solanaPubKey = await solana.connect();
  } catch (error) {
    createLog({
      providerType: 'solana',
      status: 'error',
      method: 'connect',
      message: 'encountered error while silent connecting: ' + error.message,
    });
  }

  if (solanaPubKey) {
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      createLog({
        providerType: 'ethereum',
        status: 'error',
        method: 'eth_requestAccounts',
        message: 'encountered error while silent connecting: ' + error.message,
      });
    }
  }
};
