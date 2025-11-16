# MULTIPLY Deployment Checklist

Use this checklist to ensure your MULTIPLY game is properly configured before production deployment.

## Pre-Deployment

- [ ] Smart contracts built and tested locally
- [ ] All environment variables configured in `.env.local`
- [ ] Sui wallet installed and on testnet
- [ ] Test game created successfully
- [ ] Test player joined game successfully
- [ ] Real-time blockchain events verified in console
- [ ] All blockchain transactions confirmed

## Code Quality

- [ ] No console errors in development mode
- [ ] No TypeScript compilation errors
- [ ] All dependencies installed (`npm install`)
- [ ] No hardcoded API keys or secrets
- [ ] Debug logging disabled in production
- [ ] Performance metrics checked

## Blockchain Setup

- [ ] Smart contracts published to Sui testnet
- [ ] Package ID saved and verified on explorer
- [ ] All contract functions tested via transactions
- [ ] Event emissions verified
- [ ] Gas budget calculated correctly

## Frontend Configuration

- [ ] `.env.local` properly configured with testnet details
- [ ] Sui Wallet connection tested
- [ ] Game creation working
- [ ] Player joining working
- [ ] Real-time sync monitoring functional
- [ ] Transaction monitoring working
- [ ] Chat system tested

## Testing Checklist

- [ ] Test game creation with different parameters
- [ ] Test player joining from multiple accounts
- [ ] Test real-time player position updates
- [ ] Test combat system and damage
- [ ] Test respawn mechanics
- [ ] Test leaderboard updates
- [ ] Test chat messaging
- [ ] Test wallet disconnection and reconnection
- [ ] Test with network throttling (Chrome DevTools)
- [ ] Test on mobile device

## Vercel Deployment

- [ ] GitHub repository created and code pushed
- [ ] Vercel project linked to GitHub
- [ ] All environment variables set in Vercel dashboard
- [ ] Preview deployment successful
- [ ] All features working in preview
- [ ] Production deployment successful
- [ ] DNS/domain configured if applicable

## Monitoring & Analytics

- [ ] Error tracking enabled (optional: Sentry)
- [ ] Performance monitoring configured
- [ ] Analytics initialized
- [ ] Logs aggregation set up

## Security Audit

- [ ] No sensitive data in frontend code
- [ ] No hardcoded wallet addresses
- [ ] Rate limiting on API routes implemented
- [ ] Input validation on all forms
- [ ] CORS properly configured
- [ ] SSL/TLS enabled (automatic on Vercel)

## Post-Deployment

- [ ] Monitor real-time dashboard for errors
- [ ] Check blockchain events are still streaming
- [ ] Verify player count metrics
- [ ] Monitor transaction success rate
- [ ] Set up alerts for failures
- [ ] Document any issues for follow-up

## Performance Benchmarks

- [ ] Page load time: < 3 seconds
- [ ] Game start time: < 5 seconds
- [ ] Event poll latency: < 5 seconds
- [ ] Average FPS: > 50
- [ ] Transaction confirmation: < 30 seconds

## Production Ready Checklist

- [ ] All above items completed and verified
- [ ] Team trained on monitoring dashboard
- [ ] Incident response plan documented
- [ ] Rollback procedure documented
- [ ] Backup strategy in place
- [ ] Documentation updated for end users
