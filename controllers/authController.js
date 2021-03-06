const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', { 
  failureRedirect: '/login', 
  failureFlash: 'Failed Login!',
  successReturnToOrRedirect: '/dashboard',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You have successfully logged out.');
  res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  req.flash('error', 'You must be logged in to access that page.');
  res.redirect('/login');
}

exports.forgot = async (req, res) => {
  // Check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email address exists.');
    return res.redirect('/login');
  }
  
  // Set reset tokens and expiry on account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send email with token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user, 
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset' // pug html file
  })

  req.flash('success', `You have been emailed a password reset link.`);

  // Redirect to the login page after the email token has been sent
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired.')
    return res.redirect('/login');
  }

  // if user, show password reset form
  res.render('reset', { title: 'Reset Your Password' });
}

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['confirm-password']) {
    next();
    return;
  }
  req.flash('error', 'Passwords do not match.');
  res.redirect('back');
}

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired.')
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);

  // clear out reset token and expires
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  const updatedUser = await user.save();

  // automatically log the user in
  await req.login(updatedUser);

  req.flash('success', 'Your password has been reset. You are now logged in.');
  res.redirect('/');
};