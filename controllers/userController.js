const mongoose = require('mongoose');
const moment = require('moment');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const Category = mongoose.model('Category');
const Item = mongoose.model('Item');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

// Validate registration form
exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');

  req.checkBody('name', 'Please supply a name.').notEmpty();
  req.checkBody('email', 'Please enter a valid email address.').isEmail();

  // Allow dots, extensions and subaddresses
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });

  req.checkBody('password', 'Password cannot be blank.').notEmpty();
  req.checkBody('confirm-password', 'Confirm password cannt be blank.').notEmpty();

  req.checkBody('confirm-password', 'Your passwords do not match. Please try again.').equals(req.body.password);

  const errors = req.validationErrors(); 
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }
  next();
}

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name })

  const registerWithPromise = promisify(User.register, User);

  await registerWithPromise(user, req.body.password); // encrypts password
  next();
}

exports.account = (req, res) => {
  res.render('account', {title: 'Edit Your Account'});
}

exports.updateAccount = async(req, res) => {
  const updatedValues = {
    name: req.body.name,
    email: req.body.email,
    income: req.body.income
  };

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updatedValues },
    { new: true, runValidators: true, content: 'query' } 
  );

  req.flash('success', 'Your profile has been successfully updated.');
  res.redirect('back');
}

exports.getDashboard = async (req, res, next) => {
  const startDate = (req.query.month && req.query.year) ? moment().year(req.query.year).month(req.query.month - 1).startOf('month') : moment().startOf('month');
  const endDate = (req.query.month && req.query.year) ? moment().year(req.query.year).month(req.query.month - 1).endOf('month') : moment().endOf('month');
  const month = startDate.format('MMMM');
  const monthNum = startDate.format('M');
  const year = startDate.format('YYYY');

  const sortOrder = (req.query.sort === 'titleDesc') ? { title: 1 } : (req.query.sort === 'titleAsc' ? { title: -1 } : (req.query.sort === 'spentDesc' ? {amount: -1} : ( req.query.sort === 'spentAsc' ? {amount: 1} : {title: 1})));

  const categoriesPromise = Category.find({ 'author': req.user._id }).sort(sortOrder).limit(5);
  const categoryPromise = Category.findOne({ slug: req.params.slug });
  const [categories, category] = await Promise.all([categoriesPromise, categoryPromise]);

  const getItemsByMonth = await Item.getItemsByMonth(req.user._id, startDate, endDate);
  const recentItems = await Item.find({ author: req.user._id }).sort({"date": -1}).limit(5);
  const budgetedPerMonth = await Category.budgetedPerMonth(req.user);
  const spentPerMonth = await Item.spentPerMonth(req.user, startDate, endDate);
  const itemArr = await Promise.all(categories.map(async (category) => {
    const count = await Item.numItemsByCategory(category._id, startDate, endDate);
    const itemSum = await Item.sumItemsByCategory(category._id, startDate, endDate);
    return [(count[0] || '0'), itemSum[0] || '0'];
  }));

  res.render('dashboard', { title: `${req.user.name} Dashboard`, month, monthNum, year, categories, getItemsByMonth, recentItems, budgetedPerMonth: budgetedPerMonth[0], spentPerMonth: spentPerMonth[0], itemArr, sortValue: req.query.sort})
}