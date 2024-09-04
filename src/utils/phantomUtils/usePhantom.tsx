// @ts-nocheck

import { useCallback, useEffect, useMemo, useState } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

import {
  createTransferTransactionV0,
  detectPhantomMultiChainProvider,
  pollSolanaSignatureStatus,
  signAndSendTransactionOnSolana,
  signMessageOnSolana,
} from '.';

import { PhantomInjectedProvider, TLog } from './types';

import { connect, silentlyConnect } from './connect';

// =============================================================================
// Constants
// =============================================================================

const solanaNetwork = clusterApiUrl('devnet');
// NB: This URL will only work for Phantom sandbox apps! Please do not use this for your project. If you are running this locally we recommend using one of Solana's public RPC endpoints
// const solanaNetwork = 'https://phantom-phantom-f0ad.mainnet.rpcpool.com/';
const connection = new Connection(solanaNetwork);
const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

// =============================================================================
// Typedefs
// =============================================================================

export type ConnectedAccounts = PublicKey | null;

export type ConnectedMethods =
  | {
    chain: string;
    name: string;
    onClick: (props?: any) => Promise<string>;
  }
  | {
    chain: string;
    name: string;
    onClick: (chainId?: any) => Promise<void | boolean>;
  };

import React, { createContext, useContext } from 'react';
import { getSolanaAddress } from './common';

// Define the shape of the context value
interface PhantomContextType {
  connectedAccounts: ConnectedAccounts;
  setConnectedAccounts: React.Dispatch<React.SetStateAction<ConnectedAccounts>>;
  connectedMethods: Array<{
    chain: string;
    name: string;
    onClick: () => void;
  }>;
  handleConnect: () => Promise<void>;
  logs: TLog[];
  clearLogs: () => void;
  solanaAddress?: string;
  handleDisconnect: () => void;
  handleSignAndSendTransactionOnSolana: any;
  provider: PhantomInjectedProvider;
  connection: Connection
}

// Create the context with default values
const PhantomContext = createContext<PhantomContextType | undefined>(undefined);

// Define the provider component
export const PhantomProvider: any = ({ children }) => {
  const [provider, setProvider] = useState<PhantomInjectedProvider | null>(null);

  useEffect(() => {
    const getPhantomMultiChainProvider = async () => {
      const phantomMultiChainProvider = await detectPhantomMultiChainProvider();
      setProvider(phantomMultiChainProvider);
    };
    getPhantomMultiChainProvider();
  }, []);
  const [logs, setLogs] = useState<TLog[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState(provider?.solana?.publicKey || null);

  const createLog = useCallback((log: TLog) => {
    setLogs((logs) => [...logs, log]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!provider) return;
    const { solana, ethereum } = provider;

    // attempt to eagerly connect on initial startup
    const handleSilentConnect = async () => {
      await silentlyConnect({ solana, ethereum }, createLog);
      setConnectedAccounts(provider?.solana?.publicKey || null);
    }
    if (localStorage.getItem('solana-silent-connect') === 'true') {
      handleSilentConnect();
    }
    // setupEvents({ solana, ethereum }, createLog, setEthereumSelectedAddress);

    // return () => {
    //   handleDisconnect();
    // };
  }, [provider, createLog]);

  const handleConnect = useCallback(async () => {
    if (!provider) return;
    const { solana, ethereum } = provider;
    localStorage.setItem('solana-silent-connect', 'true')
    await connect({ solana, ethereum }, createLog);
    setConnectedAccounts(provider?.solana?.publicKey || null);

    // Immediately switch to Ethereum Goerli for Sandbox purposes
    // await ensureEthereumChain(ethereum, SupportedEVMChainIds.EthereumGoerli, createLog);
  }, [provider, createLog]);

  const handleSignAndSendTransactionOnSolana = useCallback(async () => {
    if (!provider) return;
    const { solana } = provider;
    try {
      const transactionV0 = await createTransferTransactionV0(solana.publicKey, connection);
      createLog({
        providerType: 'solana',
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Requesting signature for ${JSON.stringify(transactionV0)}`,
      });
      const signature = await signAndSendTransactionOnSolana(solana, transactionV0);
      createLog({
        providerType: 'solana',
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Signed and submitted transaction ${signature}.`,
      });
      pollSolanaSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        providerType: 'solana',
        status: 'error',
        method: 'signAndSendTransaction',
        message: error.message,
      });
    }
  }, [provider, createLog]);

  const handleSignMessageOnSolana = useCallback(async () => {
    if (!provider) return;
    const { solana } = provider;
    try {
      const signedMessage = await signMessageOnSolana(solana, message);
      createLog({
        providerType: 'solana',
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${JSON.stringify(signedMessage)}`,
      });
      return signedMessage;
    } catch (error) {
      createLog({
        providerType: 'solana',
        status: 'error',
        method: 'signMessage',
        message: error.message,
      });
    }
  }, [provider, createLog]);

  const handleDisconnect = useCallback(async () => {
    if (!provider) return;
    const { solana } = provider;
    try {
      localStorage.setItem('solana-silent-connect', 'false')
      const res = await solana.disconnect();
      setConnectedAccounts(null);
    } catch (error) {
      createLog({
        providerType: 'solana',
        status: 'error',
        method: 'disconnect',
        message: error.message,
      });
    }
  }, [provider, createLog]);

  const connectedMethods = useMemo(() => [
    {
      chain: 'solana',
      name: 'Sign and Send Transaction',
      onClick: handleSignAndSendTransactionOnSolana,
    },
    {
      chain: 'solana',
      name: 'Sign Message',
      onClick: handleSignMessageOnSolana,
    },
    {
      chain: 'solana',
      name: 'Disconnect',
      onClick: handleDisconnect,
    },
  ], [handleSignAndSendTransactionOnSolana, handleSignMessageOnSolana, handleDisconnect]);

  const solanaAddress = getSolanaAddress(connectedAccounts);

  return (
    <PhantomContext.Provider
      value={{
        connectedAccounts,
        solanaAddress,
        setConnectedAccounts,
        connectedMethods,
        handleConnect,
        logs,
        clearLogs,
        handleDisconnect,
        handleSignAndSendTransactionOnSolana,
        provider,
        connection
      }}
    >
      {children}
    </PhantomContext.Provider>
  );
};

// Custom hook to use the Phantom context
export const usePhantom = (): PhantomContextType => {
  const context = useContext(PhantomContext);
  if (!context) {
    throw new Error('usePhantom must be used within a PhantomProvider');
  }
  return context;
};
