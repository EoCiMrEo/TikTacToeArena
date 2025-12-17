import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthenticationWrapper from '../../components/ui/AuthenticationWrapper';
import Button from '../../components/ui/Button';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = React.useState('verifying'); // verifying, success, error
  const [message, setMessage] = React.useState('');
  const [resendEmail, setResendEmail] = React.useState('');
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState(null); // success, error

  useEffect(() => {
    const hash = location.hash;
    
    // Parse hash parameters
    const getHashParams = () => {
      return hash.substring(1).split('&').reduce((res, item) => {
        const parts = item.split('=');
        res[parts[0]] = decodeURIComponent(parts[1]);
        return res;
      }, {});
    };

    const params = getHashParams();
    console.log('Verification params:', params);

    if (params.error) {
      setStatus('error');
      setMessage(params.error_description || 'Verification failed.');
    } else if (params.access_token) {
      setStatus('success');
      // Ideally we might want to auto-login here by sending token to backend
      // But for now, we just show success and ask to login
    } else if (params.type === 'signup') {
         // Sometimes just type=signup comes without error or token if it's a magic link redirect flow that sets cookies directly?
         // But Supabase typically sends tokens in hash. 
         // If no hash, maybe user navigated manually?
         if (!hash) {
            setStatus('manual'); // User just opened page
         }
    } else {
         if (!hash) {
             setStatus('manual');
         } else {
             // Unknown state, assume verifying
             // logic?
             setStatus('error'); 
             setMessage('Invalid verification link.');
         }
    }

  }, [location]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    
    setResendLoading(true);
    setResendStatus(null);
    
    const result = await import('../../utils/authService').then(m => m.default.resendVerification(resendEmail));
    
    setResendLoading(false);
    if (result.success) {
      setResendStatus('success');
    } else {
      setResendStatus('error');
    }
  };

  const renderContent = () => {
    if (status === 'success') {
      return (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p className="font-medium">Email Verified!</p>
              <p className="text-sm">Your account has been successfully verified.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/user-login')} variant="primary" className="w-full">
            Sign In
          </Button>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start space-x-3">
             <svg className="w-6 h-6 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p className="font-medium">Verification Failed</p>
              <p className="text-sm mt-1">{message}</p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-medium text-text-primary mb-4">Resend Verification Email</h4>
            <form onSubmit={handleResend} className="space-y-3">
               <div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                    required
                  />
               </div>
               <Button type="submit" variant="secondary" className="w-full" isLoading={resendLoading}>
                 Resend Link
               </Button>
            </form>
            
            {resendStatus === 'success' && (
               <p className="text-sm text-green-600 mt-2">Verification email sent! Please check your inbox.</p>
            )}
            {resendStatus === 'error' && (
               <p className="text-sm text-red-600 mt-2">Failed to send email. Please try again.</p>
            )}
          </div>
          
           <div className="text-center">
             <button onClick={() => navigate('/user-login')} className="text-sm text-primary hover:underline">
               Back to Sign In
             </button>
           </div>
        </div>
      );
    }
    
    if (status === 'manual') {
        return (
             <div className="space-y-6">
                <p className="text-text-secondary">
                  Please check your email and click the confirmation link to verify your account.
                </p>
                <div className="border-t border-border pt-6">
                    <h4 className="text-sm font-medium text-text-primary mb-4">Didn't receive it?</h4>
                     <form onSubmit={handleResend} className="space-y-3">
                       <div>
                          <input
                            type="email"
                            placeholder="Enter your email address"
                            value={resendEmail}
                            onChange={(e) => setResendEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                            required
                          />
                       </div>
                       <Button type="submit" variant="secondary" className="w-full" isLoading={resendLoading}>
                         Resend Verification Email
                       </Button>
                    </form>
                     {resendStatus === 'success' && (
                       <p className="text-sm text-green-600 mt-2">Verification email sent! Please check your inbox.</p>
                    )}
                </div>
                 <div className="text-center">
                     <button onClick={() => navigate('/user-login')} className="text-sm text-primary hover:underline">
                       Back to Sign In
                     </button>
                   </div>
            </div>
        );
    }

    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Verifying...</p>
      </div>
    );
  };

  return (
    <AuthenticationWrapper title="Email Verification">
       {renderContent()}
    </AuthenticationWrapper>
  );
};

export default VerifyEmail;
