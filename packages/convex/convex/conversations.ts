import { mutation } from './_generated/server'

export const create = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.insert('conversations', {})
	},
})
