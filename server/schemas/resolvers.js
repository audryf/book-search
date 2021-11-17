const { AuthenticationError } = require("apollo-server-errors");
const { User } = require("../models");
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('books')

                return userData;
            }

            throw new AuthenticationError('Please log in to continue');
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);

            const token = signToken(user);

            return { token, user };
        },
        login: async (parent, args) => {
            const user = await User.findOne({ email: args.email });

            if (!user) {
                throw new AuthenticationError('Invalid credentials');
            }

            const valid = await user.isCorrectPassword(args.password);

            if (!valid) {
                throw new AuthenticationError('Invalid credentials');
            }

            const token = signToken(user);

            return { token, user };
        },
        saveBook: async (parent, args, context) => {
            if (!context.user) {
                throw new AuthenticationError('Please log in to continue');
            }

            const user = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: { books: args.bookId } },
                { new: true, runValidators: true }
                );

            await user.save();

            return user;
        },
        removeBook: async (parent, args, context) => {
            if (!context.user) {
                throw new AuthenticationError('Please log in to continue');
            }

            const user = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { books: args.bookId } },
                { new: true, runValidators: true }
                );

            await user.save();

            return user;
        }
    }
}

module.exports = resolvers;