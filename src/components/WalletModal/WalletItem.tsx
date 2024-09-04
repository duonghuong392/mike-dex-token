import { Flex, Text } from "@chakra-ui/react";
import { WalletsConfig, WalletType } from "@src/configs/web3/wallets";
import { usePhantom } from "@src/utils/phantomUtils/usePhantom";


interface IWalletItem {
  walletConfig: WalletsConfig;
  handleLogin: (wallet: WalletsConfig) => void;
}

const WalletItem: React.FC<IWalletItem> = ({ handleLogin, walletConfig }) => {
  const { title, icon: Icon, type } = walletConfig;
  const handleSelectWallet = () => {
    handleLogin(walletConfig);
  };
  return (
    <Flex
      onClick={handleSelectWallet}
      className={
        "w-full cursor-pointer flex-col items-center justify-center rounded-2xl bg-[#F5F7F9] p-4"
      }
    >
      <Icon boxSize={"48px"} />
      <Text className={"mt-2 text-sm font-medium text-[#898F9C]"}>{title}</Text>
    </Flex>
  );
};

export default WalletItem;
