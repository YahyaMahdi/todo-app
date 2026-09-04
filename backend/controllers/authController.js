const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'الإيميل مستخدم مسبقًا' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 ساعة
    });

    const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'تفعيل حسابك — دفتر المهام',
      html: `
        <div style="font-family:sans-serif;direction:rtl;text-align:right">
          <h2>أهلاً ${user.name} 👋</h2>
          <p>اضغط الرابط لتفعيل حسابك:</p>
          <a href="${verifyUrl}" style="background:#5B5BD6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">تفعيل الحساب</a>
          <p>الرابط صالح لمدة 24 ساعة.</p>
        </div>`,
    });

    res.status(201).json({ success: true, message: 'تم إنشاء الحساب — تحقق من إيميلك لتفعيله' });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/verify/:token
const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login.html?verified=fail`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.redirect(`${process.env.CLIENT_URL}/login.html?verified=success`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login.html?verified=fail`);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'الإيميل أو كلمة السر غير صحيحة' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'يجب تفعيل الإيميل أولاً' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'الإيميل غير مسجل' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'الحساب مفعّل مسبقًا' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'إعادة إرسال رابط التفعيل',
      html: `<a href="${verifyUrl}">اضغط هنا لتفعيل حسابك</a>`,
    });

    res.status(200).json({ success: true, message: 'تم إرسال رابط التفعيل مجددًا' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, verifyEmail, login, resendVerification };