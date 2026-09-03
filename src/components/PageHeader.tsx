export default function PageHeader({title,subtitle,children}:{title:string;subtitle?:string;children?:React.ReactNode}){
 return <div className="page-head"><div><h1>{title}</h1>{subtitle&&<div className="muted">{subtitle}</div>}</div>{children}</div>
}
