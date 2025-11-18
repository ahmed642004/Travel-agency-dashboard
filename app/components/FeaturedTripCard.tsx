import { cn } from "~/lib/utils";

const FeaturedTripCard = ({
  containerClass = "",
  bigCard = false,
  rating,
  title,
  activityCount,
  bgImage,
}: DestinationProps) => (
  <section
    className={cn(
      "relative rounded-[14px] overflow-hidden size-full min-w-[280px] bg-cover bg-center",
      containerClass,
    )}
    style={{
      backgroundImage: `url(${bgImage})`, // ← This works!
    }}
  >
    <div className="bg-linear200 h-full">
      <article className="featured-card">
        <div
          className={cn(
            "bg-white rounded-20 font-bold text-red-100 w-fit py-px px-3 text-sm",
          )}
        >
          {rating}
        </div>

        <article className="flex flex-col gap-3.5">
          <h2
            className={cn("text-lg font-semibold text-white", {
              "p-30-bold": bigCard,
            })}
          >
            {title}
          </h2>

          <figure className="flex gap-2 items-center">
            <img
              src="/assets/images/david.webp"
              alt="user"
              className={cn("size-4 rounded-full aspect-square", {
                "size-11": bigCard,
              })}
            />
            <p
              className={cn("text-xs font-normal text-white", {
                "text-lg": bigCard,
              })}
            >
              {activityCount} activities
            </p>
          </figure>
        </article>
      </article>
    </div>
  </section>
);
export default FeaturedTripCard;
