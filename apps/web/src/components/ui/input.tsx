import type * as React from 'react'

import { cn } from '@/lib/utils'

type InputProps = React.ComponentProps<'input'> & {
	ref?: React.Ref<HTMLInputElement>
}

function Input({ className, ref, ...props }: InputProps) {
	return (
		<input
			className={cn(
				'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			ref={ref}
			{...props}
		/>
	)
}

export { Input }
