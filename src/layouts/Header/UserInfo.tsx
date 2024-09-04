import {
  Button,
  Flex,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useMediaQuery
} from "@chakra-ui/react";
import React, { memo } from "react";

//   import Icon from "@/components/Icon";
import { useConnectWallet } from "@src/hooks/useConnectWallet";
import { useWeb3React } from "@src/hooks/useWeb3React";
import { getTruncateHash } from "@src/utils/getTruncateHash";
import { usePhantom } from "@src/utils/phantomUtils/usePhantom";

const UserInfo: React.FC = () => {
  const { account } = useWeb3React();
  const { solanaAddress, handleDisconnect: handleDisconnectSolana } = usePhantom();
  const [isMobileScreen] = useMediaQuery("(max-width: 768px)");
  const { logout } = useConnectWallet();

  const handleLogout = async () => {
    if (solanaAddress) {
      handleDisconnectSolana()
    }
    if (account) {
      await logout();
    }
  };

  return (
    <Popover
      trigger={isMobileScreen ? "click" : "hover"}
      placement="bottom-end"
    >
      <PopoverTrigger>
        <Flex
          bgColor="bg.brand !important"
          rounded="full"
          px={4}
          py={1}
          color="bg.default"
          borderRadius={"8px"}
          height={"42px"}
          alignItems="center"
        >
          {getTruncateHash(account || solanaAddress || '', isMobileScreen ? 4 : 6)}
        </Flex>
      </PopoverTrigger>
      <Portal>
        <PopoverContent mt={2} boxShadow="md" rounded="xl" border="none">
          <PopoverBody p={0}>
            <Button
              variant="primary"
              size="md"
              w="full"
              justifyContent="flex-start"
              onClick={handleLogout}
              color="bg.default"
              bgColor="bg.brand !important"
            // leftIcon={<Icon type="common" name="logout" />}
            >
              Disconnect
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default memo(UserInfo);
