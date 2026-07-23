import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import { env } from './env';

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl || `${env.serverUrl}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            const email = profile.emails?.[0]?.value || `${profile.id}@google.placeholder`;
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              await user.save();
            } else {
              user = await User.create({
                name: profile.displayName || 'Google User',
                email,
                googleId: profile.id,
                avatarUrl: profile.photos?.[0]?.value,
              });
            }
          }
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
} else {
  console.warn('[auth] GOOGLE_CLIENT_ID/SECRET not set — Google sign-in disabled until configured.');
}

export default passport;
