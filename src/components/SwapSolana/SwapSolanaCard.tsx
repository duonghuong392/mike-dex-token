'use client';

import { Accordion, AccordionButton, AccordionIcon, AccordionItem, Flex, Input } from '@chakra-ui/react';
import styles from './swap.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, Connection } from '@solana/web3.js';
import React, { useState, useEffect, useCallback } from 'react';
import { Typography } from '../Typography';
import { RotateSwitchIcon, SettingIcon, SwitchIcon, WalletIcon } from '../Icon';
import { usePhantom } from '@src/utils/phantomUtils/usePhantom';
import ButtonConnectWallet from '../ButtonConnectWallet';
import { ButtonComponent } from '@src/containers/PoolPage';
import Image from 'next/image';
import { useWeb3React } from '@src/hooks/useWeb3React';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { signAndSendTransactionOnSolana } from '@src/utils/phantomUtils';
import { getTokenSolanaBalance } from '@src/utils/phantomUtils/common';

const assets = [
  { name: 'SOL', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x570A5D26f7765Ecb712C0924E4De545B89fD43dF/logo.png', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { name: 'USDC', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d/logo.png', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
];

const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
) => {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: T) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function SwapSolanaCard() {
  const [fromAsset, setFromAsset] = useState(assets[0]);
  const [toAsset, setToAsset] = useState(assets[1]);
  const [fromAmount, setFromAmount] = useState(0.0001);
  const [toAmount, setToAmount] = useState(0);
  const [quoteResponse, setQuoteResponse] = useState(null);
  const { solanaAddress, provider, connectedAccounts } = usePhantom()

  const wallet = useWallet();

  // Need a custom RPC so you don't get rate-limited
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || '');

  const handleFromAssetChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFromAsset(
      assets.find((asset) => asset.name === event.target.value) || assets[0]
    );
  };

  const handleToAssetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setToAsset(
      assets.find((asset) => asset.name === event.target.value) || assets[0]
    );
  };

  const handleFromValueChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFromAmount(Number(event.target.value));
  };

  const debounceQuoteCall = useCallback(debounce(getQuote, 500), []);

  useEffect(() => {
    debounceQuoteCall(fromAmount);
  }, [fromAmount, debounceQuoteCall]);

  async function getQuote(currentAmount: number) {
    if (isNaN(currentAmount) || currentAmount <= 0) {
      console.error('Invalid fromAmount value:', currentAmount);
      return;
    }

    const quote = await (
      await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${fromAsset.mint}&outputMint=${toAsset.mint}&amount=${currentAmount * Math.pow(10, fromAsset.decimals)}&slippage=0.5`
      )
    ).json();
    if (quote && quote.outAmount) {
      const outAmountNumber =
        Number(quote.outAmount) / Math.pow(10, toAsset.decimals);
      setToAmount(outAmountNumber);
    }

    setQuoteResponse(quote);
  }

  async function signAndSendTransaction() {
    // get serialized transactions for the swap
    const { swapTransaction } = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: solanaAddress,
          wrapAndUnwrapSol: true,
          // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          // feeAccount: "fee_account_public_key"
        }),
      })
    ).json();

    try {
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      // const signedTransaction = await wallet.signTransaction(transaction);
      const txid = await signAndSendTransactionOnSolana(provider.solana, transaction);
      console.log('txid', txid)
      // console.log('signedTransaction', signedTransaction)
      // const rawTransaction = signedTransaction.serialize();
      // const txid = await connection.sendRawTransaction(rawTransaction, {
      //   skipPreflight: true,
      //   maxRetries: 2,
      // });

      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid
      }, 'confirmed');

      console.log(`https://solscan.io/tx/${txid}`);

    } catch (error) {
      console.error('Error signing or sending the transaction:', error);
    }
  }

  // useEffect(() => {
  //   if (connectedAccounts) {
  //     const balanceSol = getTokenSolanaBalance(connectedAccounts, fromAsset.mint, connection)
  //     console.log('balanceSol', balanceSol)
  //   }
  // }, [])

  const iconSize = 24;

  return (
    <>
      {/* <div className={styles.body}>
      <div className={styles.innerContainer}>
        <div className={styles.inputContainer}>
          <div className={styles.labels}>You pay</div>
          <input
            type="number"
            value={fromAmount}
            onChange={handleFromValueChange}
            className={styles.inputField}
          />
          <select
            value={fromAsset.name}
            onChange={handleFromAssetChange}
            className={styles.selectField}
          >
            {assets.map((asset) => (
              <option key={asset.mint} value={asset.name}>
                {asset.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.inputContainer}>
          <div className={styles.labels}>You receive</div>
          <input
            type="number"
            value={toAmount}
            // onChange={(e) => setToAmount(Number(e.target.value))}
            className={styles.inputField}
            readOnly
          />
          <select
            value={toAsset.name}
            onChange={handleToAssetChange}
            className={styles.selectField}
          >
            {assets.map((asset) => (
              <option key={asset.mint} value={asset.name}>
                {asset.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={signAndSendTransaction}
          className={styles.button}
          disabled={toAsset.mint === fromAsset.mint}
        >
          Swap2
        </button>
      </div>
    </div> */}

      <Flex
        className="max-w-[1200px] w-full mx-auto h-full item-center"
        align={"center"}
      >
        <Flex
          borderRadius={"12px"}
          className="bg-secondary "
          flexDirection={"column"}
          h="fit-content"
          px="16px"
          w="100%"
          maxWidth="480px"
          mx="auto"
        >
          <Flex justifyContent={"space-between"} align={"center"} my="16px">
            <Typography type="headline5" className="text-primary">
              Swap Solana
            </Typography>
            <Flex>
              <SettingIcon
                // onClick={onOpen}
                cursor={"pointer"}
                boxSize={"24px"}
              />
            </Flex>
          </Flex>
          <Flex flexDirection="column">
            <Flex
              borderTopRadius={"12px"}
              p="24px 16px 28px 16px"
              className="bg-default"
              flexDirection={"column"}
              position={"relative"}
            >
              <Flex align={"center"} justifyContent={"space-between"}>
                {/* <SelectTokens
                  onSelectToken={handleInputSelect}
                  currency={currencies[Field.INPUT] ?? (defaultInput as any)}
                /> */}
                <Flex
                  px="12px"
                  py="8px"
                  borderRadius={"12px"}
                  cursor={"pointer"}
                  bg="bg.secondary"
                  w="fit-content"
                  align={"center"}
                >
                  <Image
                    style={{ minWidth: `${iconSize}px`, maxHeight: `${iconSize}px` }}
                    width={iconSize}
                    height={iconSize}
                    alt={fromAsset.name}
                    src={fromAsset.icon}
                  />
                  <Typography px="8px" type="body1" color="text.primary">
                    {fromAsset.name}
                  </Typography>
                </Flex>
                <Typography type="headline3" w="70%" className="text-secondary">
                  <Input
                    sx={{
                      fontSize: {
                        xs: "24px",
                        md: "26px",
                        lg: "28px",
                      },
                    }}
                    variant="unstyled"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={handleFromValueChange}
                    color="text.primary"
                    textAlign={"right"}
                    type="number"
                  />
                </Typography>
              </Flex>
              <Flex justifyContent={"space-between"} align={"center"} mt="16px">
                <Flex align={"center"}>
                  <Typography type="caption1-r" className="text-primary mr-2">
                    <WalletIcon boxSize={"20px"} />
                    {/* {balanceInput?.toFixed(3)}{" "} */}
                  </Typography>
                </Flex>
              </Flex>
              {/* <SwitchIcon
                position={"absolute"}
                boxSize={"36px"}
                bottom={"-18px"}
                left={"46%"}
                onClick={onSwitchTokens}
              /> */}
            </Flex>
            <Flex
              borderBottomRadius={"12px"}
              p="24px 16px 16px 16px"
              className="bg-default"
              flexDirection={"column"}
              mt="4px"
            >
              <Flex align={"center"} justifyContent={"space-between"}>
                <Flex
                  px="12px"
                  py="8px"
                  borderRadius={"12px"}
                  cursor={"pointer"}
                  bg="bg.secondary"
                  w="fit-content"
                  align={"center"}
                >
                  <Image
                    style={{ minWidth: `${iconSize}px`, maxHeight: `${iconSize}px` }}
                    width={iconSize}
                    height={iconSize}
                    alt={toAsset.name}
                    src={toAsset.icon}
                  />
                  <Typography px="8px" type="body1" color="text.primary">
                    {toAsset.name}
                  </Typography>
                </Flex>
                <Input
                  sx={{
                    fontSize: {
                      xs: "24px",
                      md: "26px",
                      lg: "28px",
                    },
                  }}
                  variant="unstyled"
                  placeholder="0.0"
                  value={toAmount}
                  // onChange={(e) => handleTypeOutput(e.target.value)}
                  color="text.primary"
                  textAlign={"right"}
                />
              </Flex>
              <Flex justifyContent={"space-between"} align={"center"} mt="9px">
                <Flex>
                  <Typography type="caption1-r" className="text-primary mr-2">
                    <WalletIcon boxSize={"20px"} />{" "}
                    {/* {balanceOutput?.toFixed(3) ?? "0.000"}{" "} */}
                  </Typography>
                  {/* <Typography
                    type="paragraph2"
                    className="text-brand"
                    cursor={"pointer"}
                    onClick={handleMaxOutput}
                  >
                    MAX{" "}
                  </Typography> */}
                </Flex>
                {/* <Typography type="body2" className="text-secondary">
                  $.00
                </Typography> */}
              </Flex>
            </Flex>
          </Flex>
          <Flex my="24px">
            <ButtonConnectWallet h="48px" w="100%">
              <ButtonComponent
                className={"prose cursor-pointer w-full bg-brand px-3 py-2"}
                h="48px"
                borderRadius={"8px"}
                textAlign="center"
                justifyContent={"center"}
                sx={{
                  bg: "bg-brand",
                }}
                isDisabled={toAsset.mint === fromAsset.mint}
                _hover={{}}
                _active={{}}
                onClick={signAndSendTransaction}
                title={'Swap'}
                loadingText={`Swaping...`}
              // isLoading={isPending}
              />
            </ButtonConnectWallet>
            {/* <SwapAction
              trade={trade}
              titleButton={titleButton}
              swapInputError={swapInputError}
              allowedSlippage={allowedSlippage}
              recipient={recipient}
              approveCallback={approveCallback}
              needApproval={needApproval}
            /> */}
          </Flex>
        </Flex>
      </Flex>
    </>

  );
}

/* Sample quote response

    {
      "inputMint": "So11111111111111111111111111111111111111112",
      "inAmount": "100000000",
      "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "outAmount": "9998099",
      "otherAmountThreshold": "9948109",
      "swapMode": "ExactIn",
      "slippageBps": 50,
      "platformFee": null,
      "priceImpactPct": "0.000146888216121999999999995",
      "routePlan": [
        {
          "swapInfo": {
            "ammKey": "HcoJqG325TTifs6jyWvRJ9ET4pDu12Xrt2EQKZGFmuKX",
            "label": "Whirlpool",
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "inAmount": "100000000",
            "outAmount": "10003121",
            "feeAmount": "4",
            "feeMint": "So1111111111111111111111111111111111111111111112"
          },
          "percent": 100
        },
        {
          "swapInfo": {
            "ammKey": "ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq",
            "label": "Meteora DLMM",
            "inputMint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "10003121",
            "outAmount": "9998099",
            "feeAmount": "1022",
            "feeMint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
          },
          "percent": 100
        }
      ],
      "contextSlot": 242289509,
      "timeTaken": 0.002764025
    }
    */
