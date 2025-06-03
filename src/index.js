import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import { AuthProvider } from './context/AuthContext';
import { ApiProvider } from './context/ApiContext';
import { ExecutiveActivityProvider } from './context/ExecutiveActivityContext';
import { BreakTimerProvider } from './context/breakTimerContext';
import { MasterProvider } from './context/MasterContext';
import { CompanyProvider } from './context/CompanyContext';
import { ThemeProvider } from './features/admin/ThemeContext';
import { ProcessProvider } from './context/ProcessAuthContext';
import { ProcessServiceProvider } from './context/ProcessServiceContext';
import { CallProvider } from './context/CallContext'; // 🆕 Global dialer context

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <ApiProvider>
          <ExecutiveActivityProvider>
            <BreakTimerProvider>
              <MasterProvider>
                <CompanyProvider>
                  <ProcessProvider>
                    <ProcessServiceProvider>
                      <CallProvider> {/* 🆕 Global wrapper for dialer */}
                        <App />
                      </CallProvider>
                    </ProcessServiceProvider>
                  </ProcessProvider>
                </CompanyProvider>
              </MasterProvider>
            </BreakTimerProvider>
          </ExecutiveActivityProvider>
        </ApiProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
