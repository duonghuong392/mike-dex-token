import { Logs, Sidebar } from '@src/components/components';
import { TLog } from '@src/utils/phantomUtils/types';
import { ConnectedAccounts, ConnectedMethods, usePhantom } from '@src/utils/phantomUtils/usePhantom';
import React from 'react'
import styled from 'styled-components';

interface Props {
  connectedAccounts: ConnectedAccounts;
  connectedMethods: ConnectedMethods[];
  handleConnect: () => Promise<void>;
  logs: TLog[];
  clearLogs: () => void;
}


const ConnectPhantom = () => {
  const { connectedAccounts, connectedMethods, handleConnect, logs, clearLogs } = usePhantom();

  return (
    <StyledApp>
      <Sidebar connectedAccounts={connectedAccounts} connectedMethods={connectedMethods} connect={handleConnect} />
      <Logs connectedAccounts={connectedAccounts} logs={logs} clearLogs={clearLogs} />
    </StyledApp>
  )
}

const StyledApp = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export default ConnectPhantom