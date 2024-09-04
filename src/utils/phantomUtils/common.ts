import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, AccountLayout } from '@solana/spl-token';
import { ConnectedAccounts } from "./usePhantom";

export const getSolanaAddress = (connectedAccounts: ConnectedAccounts) => connectedAccounts?.toBase58()
export const getTokenSolanaBalance = async (walletAddress: PublicKey, mintAddress: PublicKey, connection: Connection): Promise<number> => {
  try {
    // Get the associated token address for the wallet and mint
    const associatedTokenAddress = await getAssociatedTokenAddress(mintAddress, walletAddress);

    // Fetch the account info for the associated token address
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);

    if (accountInfo === null) {
      throw new Error('Associated token account not found.');
    }

    // Parse the account info to get the balance
    const account = AccountLayout.decode(accountInfo.data);
    const balance = account.amount.toNumber();
    console.log('balance', balance)
    return balance;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw new Error('Unable to fetch token balance.');
  }
};