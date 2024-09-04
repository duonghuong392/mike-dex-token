import React from 'react';
import styled from 'styled-components';

import { TLog } from '@src/utils/phantomUtils/types';

import { BLACK, GRAY } from '@src/utils/phantomUtils/constants';

import Button from '../Button';
import Log from './Log';
import { ConnectedAccounts } from '../../App';
import { usePhantom } from '@src/utils/phantomUtils/usePhantom';

// =============================================================================
// Styled Components
// =============================================================================

const StyledSection = styled.section`
  position: relative;
  flex: 2;
  padding: 20px;
  background-color: ${BLACK};
  overflow: auto;
  font-family: monospace;
`;

const ClearLogsButton = styled(Button)`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 100px;
`;

const PlaceholderMessage = styled.p`
  color: ${GRAY};
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  span {
    margin-right: 10px;
  }
`;

// =============================================================================
// Typedefs
// =============================================================================

interface Props {
  connectedAccounts: ConnectedAccounts;
  logs: TLog[];
  clearLogs: () => void;
}

// =============================================================================
// Main Component
// =============================================================================

const Logs = React.memo((props: Props) => {
  const { connectedAccounts, logs, clearLogs } = usePhantom();
  return (
    <StyledSection>
      {logs.length > 0 ? (
        <>
          {logs.map((log, i) => (
            <Log key={`${log.status}-${log.method}-${i}`} {...log} />
          ))}
          <ClearLogsButton onClick={clearLogs}>Clear Logs</ClearLogsButton>
        </>
      ) : (
        <Row>
          <span>{'>'}</span>
          <PlaceholderMessage>
            {connectedAccounts ? (
              // connected
              <>
                Click a button and watch magic happen...{' '}
                <span role="img" aria-label="Sparkles Emoji">
                  ✨
                </span>
              </>
            ) : (
              // not connected
              <>
                Welcome to the Phantom sandbox. Connect to your Phantom wallet and play around...{' '}
                <span role="img" aria-label="Ghost Emoji">
                  👻
                </span>
              </>
            )}
          </PlaceholderMessage>
        </Row>
      )}
    </StyledSection>
  );
});

export default Logs;
